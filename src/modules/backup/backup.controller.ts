import { Controller, Get, Post, Put, UseGuards, Res, Req, InternalServerErrorException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';

import { BackupService } from './backup.service';
import { AdminGuard } from '../../core/auth/guards/admin.guard';
import { Logger } from '../../core/logger/logger.service';

@ApiTags('Backup & Restore')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@Controller('backup')
export class BackupController {

  constructor(
    private backupService: BackupService,
    private logger: Logger,
  ) { }

  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Download a .tar.gz of the Homebridge instance.' })
  @Get('/download')
  async downloadBackup(@Res() reply) {
    try {
      return await this.backupService.downloadBackup(reply);
    } catch (e) {
      console.error(e);
      this.logger.error('Backup Failed ' + e);
      throw new InternalServerErrorException(e.message);
    }
  }

  @UseGuards(AdminGuard)
  @Post('/restore')
  @ApiOperation({
    summary: 'Upload a .tar.gz of the Homebridge instance.',
    description: 'NOTE: This endpoint does not trigger the restore process.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  restoreBackup(@Req() req, @Res() res) {
    req.multipart(async (field, file, filename, encoding, mimetype) => {
      this.backupService.uploadBackupRestore(file);
    }, (err) => {
      if (err) {
        return res.send(500).send(err.message);
      }
      return res.code(200).send();
    });
  }

  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Upload a .hbfx backup file created by third party apps.',
    description: 'NOTE: This endpoint does not trigger the restore process.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('/restore/hbfx')
  restoreHbfx(@Req() req, @Res() res) {
    req.multipart(async (field, file, filename, encoding, mimetype) => {
      this.backupService.uploadHbfxRestore(file);
    }, (err) => {
      if (err) {
        return res.send(500).send(err.message);
      }
      return res.code(200).send();
    });
  }

  @UseGuards(AdminGuard)
  @Put('/restart')
  @ApiOperation({ summary: 'Trigger a hard restart of Homebridge (use after restoring backup).' })
  postBackupRestoreRestart() {
    return this.backupService.postBackupRestoreRestart();
  }

}
