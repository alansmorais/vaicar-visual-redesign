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
    // Remove whitespace, then reject malformed base64. Buffer.from() alone silently
    // ignores invalid characters, which can make validation differ from decoding.
    base64Content = base64Content.replace(/\\s+/g, '');
    if (
      !base64Content ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(base64Content) ||
      base64Content.length % 4 === 1
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Conteúdo base64 inválido.', 400);
    }

    const buffer = Buffer.from(base64Content, 'base64');
    if (buffer.toString('base64').replace(/=+$/, '') !== base64Content.replace(/=+$/, '')) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Conteúdo base64 inválido.', 400);
    }

    const validation = validateImageBuffer(buffer);

    // Profile uploads must pass magic-byte validation; declared MIME must match file bytes.
    if (
      !validation.valid ||
      !validation.mimeType ||
      validation.mimeType === 'application/pdf' ||
      (declaredMime && declaredMime !== validation.mimeType)
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, validation.error || 'O tipo declarado não corresponde ao conteúdo da imagem.', 400);
    }

    const ext = validation.mimeType === 'image/jpeg'
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
