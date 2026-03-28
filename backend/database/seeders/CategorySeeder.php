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
            ['name' => 'General', 'description' => 'A place for general peer conversation.'],
            ['name' => 'Anxiety', 'description' => 'Talk about managing daily pressures.'],
            ['name' => 'Depression', 'description' => 'A safe space for those feeling down.'],
            ['name' => 'Loneliness', 'description' => 'A place for those feeling alone.'],
            ['name' => 'Relationships', 'description' => 'Discuss friendships, family, and more.'],
            ['name' => 'Emergency Resources', 'description' => 'Important links and hotlines.'],
            ['name' => 'Others', 'description' => 'For topics that don\'t fit elsewhere.'],
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
