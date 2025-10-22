<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear los roles necesarios para las pruebas
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'coordinator', 'guard_name' => 'web']);
        Role::create(['name' => 'seedbed_leader', 'guard_name' => 'web']);
    }

    /** @test */
    public function it_can_create_roles()
    {
        $this->assertDatabaseHas('roles', ['name' => 'admin']);
        $this->assertDatabaseHas('roles', ['name' => 'coordinator']);
        $this->assertDatabaseHas('roles', ['name' => 'seedbed_leader']);
    }

    /** @test */
    public function it_can_assign_role_to_user()
    {
        $user = User::factory()->create();

        $user->assignRole('admin');

        $this->assertTrue($user->hasRole('admin'));
        $this->assertDatabaseHas('model_has_roles', [
            'model_id' => $user->id,
            'model_type' => User::class,
            'role_id' => Role::where('name', 'admin')->first()->id,
        ]);
    }

    /** @test */
    public function it_can_remove_role_from_user()
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $user->removeRole('admin');

        $this->assertFalse($user->hasRole('admin'));
        $this->assertDatabaseMissing('model_has_roles', [
            'model_id' => $user->id,
            'model_type' => User::class,
            'role_id' => Role::where('name', 'admin')->first()->id,
        ]);
    }

    /** @test */
    public function it_can_check_user_roles()
    {
        $user = User::factory()->create();
        $user->assignRole(['admin', 'coordinator']);

        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('coordinator'));
        $this->assertFalse($user->hasRole('seedbed_leader'));

        $this->assertTrue($user->hasAnyRole(['admin', 'seedbed_leader']));
        $this->assertTrue($user->hasAllRoles(['admin', 'coordinator']));
        $this->assertFalse($user->hasAllRoles(['admin', 'coordinator', 'seedbed_leader']));
    }

    /** @test */
    public function it_can_get_users_by_role()
    {
        $admin1 = User::factory()->create();
        $admin2 = User::factory()->create();
        $coordinator = User::factory()->create();

        $admin1->assignRole('admin');
        $admin2->assignRole('admin');
        $coordinator->assignRole('coordinator');

        $admins = User::role('admin')->get();
        $coordinators = User::role('coordinator')->get();

        $this->assertCount(2, $admins);
        $this->assertCount(1, $coordinators);
        $this->assertTrue($admins->contains($admin1));
        $this->assertTrue($admins->contains($admin2));
        $this->assertTrue($coordinators->contains($coordinator));
    }

    /** @test */
    public function api_can_list_all_roles()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/roles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'guard_name', 'created_at'],
                ],
                'message',
            ])
            ->assertJsonCount(3, 'data');
    }

    /** @test */
    public function api_can_assign_role_to_user()
    {
        $admin = User::factory()->create();
        $targetUser = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles/assign', [
                'user_id' => $targetUser->id,
                'role_name' => 'admin',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => "Rol 'admin' asignado exitosamente al usuario {$targetUser->name}",
            ]);

        $this->assertTrue($targetUser->fresh()->hasRole('admin'));
    }

    /** @test */
    public function api_can_remove_role_from_user()
    {
        $admin = User::factory()->create();
        $targetUser = User::factory()->create();
        $targetUser->assignRole('admin');

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles/remove', [
                'user_id' => $targetUser->id,
                'role_name' => 'admin',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => "Rol 'admin' removido exitosamente del usuario {$targetUser->name}",
            ]);

        $this->assertFalse($targetUser->fresh()->hasRole('admin'));
    }

    /** @test */
    public function api_can_check_user_role()
    {
        $admin = User::factory()->create();
        $targetUser = User::factory()->create();
        $targetUser->assignRole('admin');

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles/check', [
                'user_id' => $targetUser->id,
                'role_name' => 'admin',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'has_role' => true,
                ],
            ]);
    }

    /** @test */
    public function api_can_get_user_roles()
    {
        $admin = User::factory()->create();
        $targetUser = User::factory()->create();
        $targetUser->assignRole(['admin', 'coordinator']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/roles/user/{$targetUser->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $targetUser->id,
                        'name' => $targetUser->name,
                        'email' => $targetUser->email,
                    ],
                    'roles' => ['admin', 'coordinator'],
                ],
            ]);
    }

    /** @test */
    public function api_can_get_users_by_role()
    {
        $admin = User::factory()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $user1->assignRole('admin');
        $user2->assignRole('admin');

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/roles/users/admin');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'role' => ['name' => 'admin'],
                    'total_users' => 2,
                ],
            ])
            ->assertJsonCount(2, 'data.users');
    }

    /** @test */
    public function api_validates_role_assignment_data()
    {
        $admin = User::factory()->create();

        // Test sin user_id
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles/assign', [
                'role_name' => 'admin',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);

        // Test sin role_name
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles/assign', [
                'user_id' => 1,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role_name']);

        // Test con rol inexistente
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles/assign', [
                'user_id' => $admin->id,
                'role_name' => 'nonexistent_role',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role_name']);
    }

    /** @test */
    public function api_prevents_duplicate_role_assignment()
    {
        $admin = User::factory()->create();
        $targetUser = User::factory()->create();
        $targetUser->assignRole('admin');

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles/assign', [
                'user_id' => $targetUser->id,
                'role_name' => 'admin',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'El usuario ya tiene asignado este rol',
            ]);
    }

    /** @test */
    public function api_prevents_removing_non_assigned_role()
    {
        $admin = User::factory()->create();
        $targetUser = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/roles/remove', [
                'user_id' => $targetUser->id,
                'role_name' => 'admin',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'El usuario no tiene asignado este rol',
            ]);
    }
}
