<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Pterodactyl\Enums\ValheimModStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValheimModInstalling extends Model
{
    /**
     * @var string
     */
    protected $table = 'valheim_installing_mods';

    /**
     * @var bool
     */
    public $incrementing = false;

    /**
     * @var string[]
     */
    protected $fillable = [
        'id',
        'installing_parent_id',
        'server_id',
        'mod_uuid4',
        'version_uuid4',
        'status',
        'download_url',
    ];

    /**
     * @var array
     */
    protected $attributes = [
        'status' => ValheimModStatus::COLLECTING,
        'download_url' => null,
    ];

    /**
     * @return BelongsTo
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class, 'server_id', 'id');
    }
}
