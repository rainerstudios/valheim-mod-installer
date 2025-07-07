<?php

namespace Pterodactyl\Enums;

enum ValheimModStatus: string
{
    const COLLECTING = 'collecting';
    const DOWNLOADING = 'downloading';
    const FAILED = 'failed';
    const INSTALLED = 'installed';
}
