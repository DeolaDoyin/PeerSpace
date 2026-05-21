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
        'is_pinned',
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
            $post->slug = static::generateUniqueSlug($post->title);
        });
        static::updating(function ($post) {
            $post->slug = static::generateUniqueSlug($post->title, $post->id);
        });
    }

    protected static function generateUniqueSlug(string $title, ?int $excludeId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (static::where('slug', $slug)->when($excludeId, function ($query) use ($excludeId) {
            $query->where('id', '!=', $excludeId);
        })->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        return $slug;
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
