import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken, verifyToken } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Middleware to check admin role
async function checkAdmin(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true, isActive: true },
  });

  return user?.role === 'admin' && user.isActive ? decoded : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const importExport = await db.importExport.findUnique({
      where: { id: params.id },
    });

    if (!importExport) {
      return NextResponse.json(
        { error: 'Import/Export job not found' },
        { status: 404 }
      );
    }

    if (importExport.type !== 'export' || !importExport.filePath) {
      return NextResponse.json(
        { error: 'Only export files can be downloaded' },
        { status: 400 }
      );
    }

    try {
      const fileContent = await readFile(importExport.filePath, 'utf-8');
      
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': importExport.fileType === 'csv' ? 'text/csv' : 'application/json',
          'Content-Disposition': `attachment; filename="${importExport.fileName}"`,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found or cannot be read' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const importExport = await db.importExport.findUnique({
      where: { id: params.id },
    });

    if (!importExport) {
      return NextResponse.json(
        { error: 'Import/Export job not found' },
        { status: 404 }
      );
    }

    await db.importExport.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Import/Export job deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting import/export job:', error);
    return NextResponse.json(
      { error: 'Failed to delete import/export job' },
      { status: 500 }
    );
  }
}