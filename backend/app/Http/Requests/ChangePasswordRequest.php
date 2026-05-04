<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password as PasswordRule;

class ChangePasswordRequest extends FormRequest
{
    public function authorize()
    {
        return true; // authenticated middleware handles authorization
    }

    public function rules()
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', PasswordRule::min(8)],
        ];
    }
}
