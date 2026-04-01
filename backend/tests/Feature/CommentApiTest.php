<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommentApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeCategory(): Category
    {
        return Category::create([
            'name' => 'General',
            'slug' => 'general-'.uniqid(),
            'description' => 'General discussion',
        ]);
    }

    private function makePost(User $author, Category $category): Post
    {
        return Post::create([
            'title' => 'Test post',
            'slug' => 'test-post-'.uniqid(),
            'body' => '',
            'user_id' => $author->id,
            'category_id' => $category->id,
        ]);
    }

    public function test_author_can_delete_own_comment(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        $post = $this->makePost($user, $category);
        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $user->id,
            'content' => 'Remove me',
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/comments/{$comment->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_user_cannot_delete_others_comment(): void
    {
        $author = User::factory()->create();
        $intruder = User::factory()->create();
        $category = $this->makeCategory();
        $post = $this->makePost($author, $category);
        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $author->id,
            'content' => 'Not yours',
        ]);

        Sanctum::actingAs($intruder);

        $this->deleteJson("/api/comments/{$comment->id}")->assertForbidden();
        $this->assertDatabaseHas('comments', ['id' => $comment->id]);
    }

    public function test_moderator_can_delete_others_comment(): void
    {
        $author = User::factory()->create();
        $moderator = User::factory()->create(['role' => 'moderator']);
        $category = $this->makeCategory();
        $post = $this->makePost($author, $category);
        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $author->id,
            'content' => 'Mod can remove',
        ]);

        Sanctum::actingAs($moderator);

        $this->deleteJson("/api/comments/{$comment->id}")->assertOk();
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_comments_index_supports_optional_pagination(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        $post = $this->makePost($user, $category);
        foreach (['a', 'b', 'c'] as $text) {
            Comment::create([
                'post_id' => $post->id,
                'user_id' => $user->id,
                'content' => $text,
            ]);
        }

        Sanctum::actingAs($user);

        $plain = $this->getJson("/api/posts/{$post->id}/comments")->assertOk();
        $plain->assertJsonCount(3);

        $paged = $this->getJson("/api/posts/{$post->id}/comments?per_page=2")->assertOk();
        $paged->assertJsonPath('total', 3);
        $paged->assertJsonCount(2, 'data');
    }
}
