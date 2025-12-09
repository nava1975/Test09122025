using Backend.Interfaces;
using Backend.Models;
using System.Text.Json;
using System.IO;
using System.Text.Json.Serialization;

namespace Backend.Repositories
{
    public class BulletinPostRepository : IBulletinPostRepository
    {
        private readonly List<BulletinPost> _posts = new();
        private readonly object _lock = new();
        private readonly string _filePath;

        public BulletinPostRepository()
        {
            var dataDir = Path.Combine(AppContext.BaseDirectory, "Data");
            if (!Directory.Exists(dataDir))
                Directory.CreateDirectory(dataDir);

            _filePath = Path.Combine(dataDir, "posts.json");
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
                    var posts = JsonSerializer.Deserialize<List<BulletinPost>>(json, GetJsonOptions());
                    _posts.Clear();
                    if (posts != null)
                        _posts.AddRange(posts);
                }
                catch
                {
                    // ignore errors
                }
            }
        }

        private void SaveToFile()
        {
            lock (_lock)
            {
                var json = JsonSerializer.Serialize(_posts, GetJsonOptions());
                File.WriteAllText(_filePath, json);
            }
        }

        public Task<IEnumerable<BulletinPost>> GetAllAsync()
        {
            lock (_lock)
            {
                return Task.FromResult<IEnumerable<BulletinPost>>(_posts.ToList());
            }
        }

        public Task<BulletinPost?> GetByIdAsync(string id)
        {
            lock (_lock)
            {
                var post = _posts.FirstOrDefault(p => p.Id == id);
                return Task.FromResult(post);
            }
        }

        public Task<IEnumerable<BulletinPost>> GetByCategoryAsync(string category)
        {
            lock (_lock)
            {
                var posts = _posts.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
                return Task.FromResult<IEnumerable<BulletinPost>>(posts);
            }
        }

        public Task<IEnumerable<BulletinPost>> GetByCityAsync(string city)
        {
            lock (_lock)
            {
                var posts = _posts.Where(p => p.Location.City.Equals(city, StringComparison.OrdinalIgnoreCase)).ToList();
                return Task.FromResult<IEnumerable<BulletinPost>>(posts);
            }
        }

        public Task<IEnumerable<BulletinPost>> GetByStatusAsync(PostStatus status)
        {
            lock (_lock)
            {
                var posts = _posts.Where(p => p.Status == status).ToList();
                return Task.FromResult<IEnumerable<BulletinPost>>(posts);
            }
        }

        public Task<IEnumerable<BulletinPost>> SearchAsync(string? category = null, string? subCategory = null,
            decimal? minPrice = null, decimal? maxPrice = null, string? city = null, string? area = null, 
            string? address = null, PostStatus? status = null, string? searchText = null, 
            DateTime? fromDate = null, DateTime? toDate = null, double? latitude = null, double? longitude = null, double? radiusKm = null)
        {
            lock (_lock)
            {
                var query = _posts.AsEnumerable();

                if (!string.IsNullOrEmpty(searchText))
                {
                    query = query.Where(p => 
                        p.Title.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                        (p.Description != null && p.Description.Contains(searchText, StringComparison.OrdinalIgnoreCase)));
                }

                if (!string.IsNullOrEmpty(category))
                    query = query.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrEmpty(subCategory))
                    query = query.Where(p => p.SubCategory.Equals(subCategory, StringComparison.OrdinalIgnoreCase));

                if (minPrice.HasValue)
                    query = query.Where(p => p.Price >= minPrice.Value);

                if (maxPrice.HasValue)
                    query = query.Where(p => p.Price <= maxPrice.Value);

                if (!string.IsNullOrEmpty(city))
                    query = query.Where(p => p.Location.City.Equals(city, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrEmpty(area))
                    query = query.Where(p => p.Location.Area != null && 
                        p.Location.Area.Equals(area, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrEmpty(address))
                    query = query.Where(p => 
                        (p.Location.Street != null && p.Location.Street.Contains(address, StringComparison.OrdinalIgnoreCase)) ||
                        (p.Location.Area != null && p.Location.Area.Contains(address, StringComparison.OrdinalIgnoreCase)) ||
                        p.Location.City.Contains(address, StringComparison.OrdinalIgnoreCase));

                if (status.HasValue)
                    query = query.Where(p => p.Status == status.Value);

                if (fromDate.HasValue)
                    query = query.Where(p => p.CreatedAt.Date >= fromDate.Value.Date);

                if (toDate.HasValue)
                    query = query.Where(p => p.CreatedAt.Date <= toDate.Value.Date);

                // Filter by distance if coordinates and radius are provided
                if (latitude.HasValue && longitude.HasValue && radiusKm.HasValue)
                {
                    query = query.Where(p =>
                    {
                        if (!p.Location.Latitude.HasValue || !p.Location.Longitude.HasValue)
                            return false;

                        var distance = CalculateDistance(
                            latitude.Value, longitude.Value,
                            p.Location.Latitude.Value, p.Location.Longitude.Value);

                        return distance <= radiusKm.Value;
                    });
                }

                return Task.FromResult<IEnumerable<BulletinPost>>(query.ToList());
            }
        }

        // Haversine formula to calculate distance between two points in kilometers
        private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371; // Earth's radius in kilometers

            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = R * c;

            return distance;
        }

        private static double ToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }

        public Task<BulletinPost> CreateAsync(BulletinPost post)
        {
            lock (_lock)
            {
                post.Id = Guid.NewGuid().ToString();
                post.CreatedAt = DateTime.Now;
                _posts.Add(post);
                SaveToFile();
                return Task.FromResult(post);
            }
        }

        public Task<BulletinPost?> UpdateAsync(string id, BulletinPost post)
        {
            lock (_lock)
            {
                var existing = _posts.FirstOrDefault(p => p.Id == id);
                if (existing == null)
                    return Task.FromResult<BulletinPost?>(null);

                existing.Category = post.Category;
                existing.SubCategory = post.SubCategory;
                existing.Price = post.Price;
                existing.ImageUrl = post.ImageUrl;
                existing.Location = post.Location;
                existing.OwnerName = post.OwnerName;
                existing.Phone1 = post.Phone1;
                existing.Phone2 = post.Phone2;
                existing.Status = post.Status;

                SaveToFile();
                return Task.FromResult<BulletinPost?>(existing);
            }
        }

        public Task<bool> DeleteAsync(string id)
        {
            lock (_lock)
            {
                var post = _posts.FirstOrDefault(p => p.Id == id);
                if (post == null)
                    return Task.FromResult(false);

                _posts.Remove(post);
                SaveToFile();
                return Task.FromResult(true);
            }
        }

        public Task<bool> ExistsAsync(string id)
        {
            lock (_lock)
            {
                return Task.FromResult(_posts.Any(p => p.Id == id));
            }
        }
    }
}
