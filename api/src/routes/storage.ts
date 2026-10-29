import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { ErrorCode } from '../../../shared/src/errors.js';
import { validateImageBuffer, storeImage } from '../services/storage.js';
import { authenticate, type AuthenticatedUser } from '../middleware/auth.js';

export const storageRouter = Router();

storageRouter.post('/upload', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileData, pathPrefix, uid } = req.body;
    const authUid = (req.user as AuthenticatedUser | undefined)?.authUid;
    if (!authUid || typeof uid !== 'string' || uid !== authUid) {
      throw new AppError(ErrorCode.FORBIDDEN, 'O UID do upload não corresponde à identidade autenticada.', 403);
    }
    // This endpoint is only for profile images. Sensitive documents require a separate private-storage flow.
    if (pathPrefix !== undefined && !['users', 'passengers', 'drivers'].includes(pathPrefix)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tipo de upload não permitido neste endpoint.', 400);
    }
    if (!fileData || typeof fileData !== 'string') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Dados do arquivo de imagem não fornecidos.', 400);
    }

    // Extract base64 payload
    let base64Content = fileData;
    let declaredMime: string | undefined;
    if (fileData.includes(';base64,')) {
      const parts = fileData.split(';base64,');
      declaredMime = parts[0].replace(/^data:/, '').toLowerCase();
      base64Content = parts[1];
    }
    // Remove all whitespace, line breaks or carriage returns from base64
    base64Content = base64Content.replace(/\s+/g, '');

    const buffer = Buffer.from(base64Content, 'base64');
    let validation = validateImageBuffer(buffer);

    // Profile uploads must pass magic-byte validation; declared MIME alone is never sufficient.
    if (!validation.valid || !validation.mimeType || validation.mimeType === 'application/pdf') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, validation.error || 'Arquivo inválido. Envie imagem (JPG, PNG, WebP) ou documento PDF.', 400);
    }

    const ext = validation.mimeType === 'application/pdf'
      ? 'pdf'
      : validation.mimeType === 'image/jpeg'
      ? 'jpg'
      : validation.mimeType === 'image/png'
      ? 'png'
      : 'webp';

    const folder = pathPrefix || 'users';
    const userPart = authUid;
    const storagePath = `${folder}/${userPart}/profile.${ext}`;

    const uploadResult = await storeImage(storagePath, buffer, validation.mimeType);

    res.json({
      success: true,
      requestId: req.id,
      data: uploadResult,
    });
  } catch (error) {
    next(error);
  }
});
