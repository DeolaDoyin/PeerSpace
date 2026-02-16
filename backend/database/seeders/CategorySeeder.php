<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'General Support', 'description' => 'A place for general peer conversation.'],
            ['name' => 'Anxiety & Stress', 'description' => 'Talk about managing daily pressures.'],
            ['name' => 'Depression & Low Mood', 'description' => 'A safe space for those feeling down.'],
            ['name' => 'Recovery Stories', 'description' => 'Share your journey and successes.'],
            ['name' => 'Emergency Resources', 'description' => 'Important links and hotlines.']
        ];

        foreach ($categories as $category) {
            Category::create([
                'name' => $category['name'],
                'slug' => Str::slug($category['name']),
                'description' => $category['description'],
            ]);
        }
    }
}
