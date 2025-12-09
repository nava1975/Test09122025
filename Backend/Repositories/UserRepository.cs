using Backend.Interfaces;
using Backend.Models;
using System.Text.Json;
using System.IO;
using System.Text.Json.Serialization;

namespace Backend.Repositories;

public class UserRepository : IUserRepository
{
    private readonly List<User> _users = new();
    private readonly object _lock = new();
    private readonly string _filePath;

    public UserRepository()
    {
        var dataDir = Path.Combine(AppContext.BaseDirectory, "Data");
        if (!Directory.Exists(dataDir))
            Directory.CreateDirectory(dataDir);

        _filePath = Path.Combine(dataDir, "users.json");
        LoadFromFile();
    }

    private static JsonSerializerOptions GetJsonOptions()
        => new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
            Converters = { new JsonStringEnumConverter() }
        };

    private void LoadFromFile()
    {
        lock (_lock)
        {
            if (!File.Exists(_filePath))
                return;

            try
            {
                var json = File.ReadAllText(_filePath);
                var users = JsonSerializer.Deserialize<List<User>>(json, GetJsonOptions());
                _users.Clear();
                if (users != null)
                    _users.AddRange(users);
            }
            catch
            {
                // ignore deserialization errors for now
            }
        }
    }

    private void SaveToFile()
    {
        lock (_lock)
        {
            var json = JsonSerializer.Serialize(_users, GetJsonOptions());
            File.WriteAllText(_filePath, json);
        }
    }

    public Task<User?> GetByIdAsync(string id)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            return Task.FromResult(user);
        }
    }

    public Task<User?> GetByUsernameAsync(string username)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(user);
        }
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(user);
        }
    }

    public Task<IEnumerable<User>> GetAllAsync()
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<User>>(_users.ToList());
        }
    }

    public Task<User> CreateAsync(User user)
    {
        lock (_lock)
        {
            
            _users.Add(user);
            SaveToFile();
            return Task.FromResult(user);
        }
    }

    public Task<User?> UpdateAsync(string id, User user)
    {
        lock (_lock)
        {
            var existingUser = _users.FirstOrDefault(u => u.Id == id);
            if (existingUser == null)
                return Task.FromResult<User?>(null);

            existingUser.Email = user.Email;
            existingUser.FullName = user.FullName;
            existingUser.Phone = user.Phone;
            existingUser.Role = user.Role;
            existingUser.IsActive = user.IsActive;
            existingUser.LastLoginAt = user.LastLoginAt;

            SaveToFile();
            return Task.FromResult<User?>(existingUser);
        }
    }

    public Task<bool> DeleteAsync(string id)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null)
                return Task.FromResult(false);

            _users.Remove(user);
            SaveToFile();
            return Task.FromResult(true);
        }
    }

    public Task<(bool usernameExists, bool emailExists)> ExistsAsync(string username, string email)
    {
        lock (_lock)
        {
            var usernameExists = _users.Any(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
            var emailExists = _users.Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult((usernameExists, emailExists));
        }
    }
}
