<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Post;

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Post::create([
            'title' => 'Hello from Laravel',
            'slug' => 'hello-from-laravel',
            'body' => 'This is the body of the first post.',
            'user_id' => 1,
            'category_id' => 1,
        ]);

        Post::create([
            'title' => 'Real Data',
            'slug' => 'real-data',
            'body' => 'If you see this, the API works.',
            'user_id' => 1,
            'category_id' => 2,
        ]);

        Post::create([
            'title' => 'Self-care tips during finals week',
            'slug' => 'self-care-tips-during-finals-week',
            'body' => 'Additional confirmation.',
            'user_id' => 1,
            'category_id' => 3,
        ]);
    }
}
