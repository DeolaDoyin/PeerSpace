<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Post extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'body',
        'user_id',
        'category_id',
    ];

     protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }


    public function creator() : BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id', 'id');
    }

    public function likes()
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($post) {
            $post->slug = Str::slug($post->title);
        });
        static::updating(function ($post) {
            $post->slug = Str::slug($post->title);
        });
    }

    public function savedByUsers()
    {
        return $this->belongsToMany(User::class, 'post_user_saved');
    }

    public function hiddenByUsers()
    {
        return $this->belongsToMany(User::class, 'post_user_hidden');
    }

    public function followedByUsers()
    {
        return $this->belongsToMany(User::class, 'post_user_followed');
    }

    use HasFactory;
}
