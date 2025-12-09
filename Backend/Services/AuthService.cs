using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Backend.DTOs;
using Backend.Interfaces;
using Backend.Models;

namespace Backend.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IUserRepository userRepository, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto loginDto)
    {
        var user = await _userRepository.GetByUsernameAsync(loginDto.Username);
        
        if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for username: {Username}", loginDto.Username);
            return null;
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login attempt for inactive user: {Username}", loginDto.Username);
            return null;
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user.Id, user);

        var token = GenerateToken(user.Id, user.Username, user.Role.ToString());

        return new LoginResponseDto
        {
            Token = token,
            User = MapToDto(user)
        };
    }

    public async Task<(UserDto? user, string? errorMessage)> RegisterAsync(RegisterDto registerDto)
    {
        var (usernameExists, emailExists) = await _userRepository.ExistsAsync(registerDto.Username, registerDto.Email);

        if (usernameExists || emailExists)
        {
            if (usernameExists && emailExists)
            {
                _logger.LogWarning("Registration attempt with existing username and email: {Username}, {Email}", registerDto.Username, registerDto.Email);
                return (null, "Username and email already exist");
            }

            if (usernameExists)
            {
                _logger.LogWarning("Registration attempt with existing username: {Username}", registerDto.Username);
                return (null, "Username already exists");
            }

            // emailExists
            _logger.LogWarning("Registration attempt with existing email: {Email}", registerDto.Email);
            return (null, "Email already exists");
        }

        var user = new User
        {
            Username = registerDto.Username,
            Email = registerDto.Email,
            PasswordHash = HashPassword(registerDto.Password),
            FullName = registerDto.FullName,
            Phone = registerDto.Phone,
            Address = registerDto.Address,
            Role = UserRole.User,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var createdUser = await _userRepository.CreateAsync(user);
        _logger.LogInformation("New user registered: {Username}", user.Username);

        return (MapToDto(createdUser), null);
    }

    public async Task<UserDto?> GetUserByIdAsync(string id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto?> GetUserByUsernameAsync(string username)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapToDto);
    }

    public async Task<UserDto?> UpdateProfileAsync(string userId, UpdateProfileDto updateProfileDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null)
        {
            return null;
        }

        user.FullName = updateProfileDto.FullName;
        user.Phone = updateProfileDto.Phone;
        user.Address = updateProfileDto.Address;

        var updated = await _userRepository.UpdateAsync(userId, user);
        return updated != null ? MapToDto(updated) : null;
    }

    public async Task<UserDto?> UpdateProfileImageAsync(string userId, string imageUrl)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null)
        {
            return null;
        }

        user.ProfileImageUrl = imageUrl;

        var updated = await _userRepository.UpdateAsync(userId, user);
        return updated != null ? MapToDto(updated) : null;
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null || !VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash))
        {
            return false;
        }

        user.PasswordHash = HashPassword(changePasswordDto.NewPassword);
        await _userRepository.UpdateAsync(userId, user);
        
        _logger.LogInformation("Password changed for user: {Username}", user.Username);
        return true;
    }

    public async Task<bool> DeleteUserAsync(string id)
    {
        return await _userRepository.DeleteAsync(id);
    }

    public string GenerateToken(string userId, string username, string role)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = jwtSettings["Key"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLongForHS256!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("userId", userId),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"] ?? "MarketBourd",
            audience: jwtSettings["Audience"] ?? "MarketBourdUsers",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiryInMinutes"] ?? "1440")),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        var passwordHash = HashPassword(password);
        return passwordHash == hash;
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Address = user.Address,
            ProfileImageUrl = user.ProfileImageUrl,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }
}
