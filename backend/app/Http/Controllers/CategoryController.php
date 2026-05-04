<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index()
    {
        // Return categories 
        return Cache::rememberForever('categories', function () {
            return Category::get();
        });
    }

    // Admin Only: Create a new category
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:categories,name',
            'description' => 'nullable|string',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $category = Category::create($data);

        Cache::forget('categories');

        return response()->json($category, 201);
    }
}
