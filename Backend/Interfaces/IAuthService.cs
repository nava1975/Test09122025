using Backend.DTOs;

namespace Backend.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginDto loginDto);
    // Returns (user, errorMessage). If registration fails due to duplicate, user will be null and errorMessage will explain why.
    Task<(UserDto? user, string? errorMessage)> RegisterAsync(RegisterDto registerDto);
    Task<UserDto?> GetUserByIdAsync(string id);
    Task<UserDto?> GetUserByUsernameAsync(string username);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto?> UpdateProfileAsync(string userId, UpdateProfileDto updateProfileDto);
    Task<UserDto?> UpdateProfileImageAsync(string userId, string imageUrl);
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);
    Task<bool> DeleteUserAsync(string id);
    string GenerateToken(string userId, string username, string role);
}
