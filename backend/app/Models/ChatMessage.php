<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $table = 'messages';

    // 💡 Update fillable attributes to include E2EE columns
    protected $fillable = [
        'chat_id',
        'user_id',
        'encrypted_payload',
        'iv',
    ];

    /**
     * 💡 Backward-Compatibility Virtual Attribute
     * * If any legacy event broadcast or controller tries to read $message->body,
     * this returns a placeholder warning string. If they try to set $message->body = 'text',
     * it automatically prevents it, enforcing data integrity.
     */
    protected function body(): Attribute
    {
        return Attribute::make(
            get: fn () => '[End-to-End Encrypted Content]',
            set: fn ($value) => [] // Disallow setting text directly via 'body'
        );
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}