using Backend.Models;

namespace Backend.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<IEnumerable<User>> GetAllAsync();
    Task<User> CreateAsync(User user);
    Task<User?> UpdateAsync(string id, User user);
    Task<bool> DeleteAsync(string id);
    // Returns tuple: (usernameExists, emailExists)
    Task<(bool usernameExists, bool emailExists)> ExistsAsync(string username, string email);
}
