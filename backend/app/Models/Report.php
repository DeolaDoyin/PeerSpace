<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    // This allows the create() method to work
    protected $fillable = ['user_id', 'post_id', 'reason', 'status'];
}