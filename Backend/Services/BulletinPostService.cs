using Backend.DTOs;
using Backend.Interfaces;
using Backend.Models;

namespace Backend.Services
{
    public class BulletinPostService : IBulletinPostService
    {
        private readonly IBulletinPostRepository _repository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<BulletinPostService> _logger;

        public BulletinPostService(IBulletinPostRepository repository, IUserRepository userRepository, ILogger<BulletinPostService> logger)
        {
            _repository = repository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<BulletinPostDto>> GetAllPostsAsync()
        {
            var posts = await _repository.GetAllAsync();
            var dtos = new List<BulletinPostDto>();
            foreach (var post in posts)
            {
                dtos.Add(await MapToDtoAsync(post));
            }
            return dtos;
        }

        public async Task<BulletinPostDto?> GetPostByIdAsync(string id)
        {
            var post = await _repository.GetByIdAsync(id);
            return post != null ? await MapToDtoAsync(post) : null;
        }

        public async Task<IEnumerable<BulletinPostDto>> GetPostsByCategoryAsync(string category)
        {
            var posts = await _repository.GetByCategoryAsync(category);
            var dtos = new List<BulletinPostDto>();
            foreach (var post in posts)
            {
                dtos.Add(await MapToDtoAsync(post));
            }
            return dtos;
        }

        public async Task<IEnumerable<BulletinPostDto>> GetPostsByCityAsync(string city)
        {
            var posts = await _repository.GetByCityAsync(city);
            var dtos = new List<BulletinPostDto>();
            foreach (var post in posts)
            {
                dtos.Add(await MapToDtoAsync(post));
            }
            return dtos;
        }

        public async Task<IEnumerable<BulletinPostDto>> GetPostsByStatusAsync(string status)
        {
            if (!Enum.TryParse<PostStatus>(status, true, out var postStatus))
            {
                throw new ArgumentException($"Invalid status: {status}");
            }

            var posts = await _repository.GetByStatusAsync(postStatus);
            var dtos = new List<BulletinPostDto>();
            foreach (var post in posts)
            {
                dtos.Add(await MapToDtoAsync(post));
            }
            return dtos;
        }

        public async Task<IEnumerable<BulletinPostDto>> SearchPostsAsync(BulletinPostFilterDto filter)
        {
            PostStatus? status = null;
            if (!string.IsNullOrEmpty(filter.Status))
            {
                if (Enum.TryParse<PostStatus>(filter.Status, true, out var parsedStatus))
                {
                    status = parsedStatus;
                }
            }

            var posts = await _repository.SearchAsync(
                filter.Category,
                filter.SubCategory,
                filter.MinPrice,
                filter.MaxPrice,
                filter.City,
                filter.Area,
                filter.Address,
                status,
                filter.SearchText,
                filter.FromDate,
                filter.ToDate,
                filter.Latitude,
                filter.Longitude,
                filter.RadiusKm
            );

            var dtos = new List<BulletinPostDto>();
            foreach (var post in posts)
            {
                dtos.Add(await MapToDtoAsync(post));
            }
            return dtos;
        }

        public async Task<BulletinPostDto> CreatePostAsync(CreateBulletinPostDto dto, string? imageUrl = null, string? userId = null)
        {
            // Parse status
            PostStatus status = PostStatus.Active;
            if (!string.IsNullOrEmpty(dto.Status))
            {
                Enum.TryParse<PostStatus>(dto.Status, true, out status);
            }

            var post = new BulletinPost
            {
                Title = dto.Title,
                Category = dto.Category,
                SubCategory = dto.SubCategory ?? string.Empty,
                Price = dto.Price,
                ImageUrl = imageUrl ?? string.Empty,
                Location = new LocationInfo
                {
                    City = dto.LocationCity,
                    Area = dto.LocationArea,
                    Street = dto.LocationStreet,
                    Latitude = dto.LocationLatitude,
                    Longitude = dto.LocationLongitude
                },
                OwnerName = dto.OwnerName,
                Phone1 = dto.Phone1,
                Phone2 = dto.Phone2,
                Description = dto.Description,
                Status = status,
                CreatedAt = DateTime.Now,
                CreatedBy = userId ?? string.Empty
            };

            var created = await _repository.CreateAsync(post);
            _logger.LogInformation("Created new bulletin post with ID: {PostId}", created.Id);
            return await MapToDtoAsync(created);
        }

        public async Task<BulletinPostDto?> UpdatePostAsync(string id, UpdateBulletinPostDto dto, string? imageUrl = null)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null)
            {
                _logger.LogWarning("Attempted to update non-existent post with ID: {PostId}", id);
                return null;
            }

            if (!string.IsNullOrEmpty(dto.Title))
                existing.Title = dto.Title;

            if (!string.IsNullOrEmpty(dto.Category))
                existing.Category = dto.Category;

            if (!string.IsNullOrEmpty(dto.SubCategory))
                existing.SubCategory = dto.SubCategory;

            if (dto.Price.HasValue)
                existing.Price = dto.Price.Value;

            if (imageUrl != null)
                existing.ImageUrl = imageUrl;

            if (!string.IsNullOrEmpty(dto.LocationCity))
                existing.Location.City = dto.LocationCity;
            
            if (dto.LocationArea != null)
                existing.Location.Area = dto.LocationArea;
            
            if (dto.LocationStreet != null)
                existing.Location.Street = dto.LocationStreet;
            
            if (dto.LocationLatitude.HasValue)
                existing.Location.Latitude = dto.LocationLatitude;
            
            if (dto.LocationLongitude.HasValue)
                existing.Location.Longitude = dto.LocationLongitude;

            if (!string.IsNullOrEmpty(dto.OwnerName))
                existing.OwnerName = dto.OwnerName;

            if (!string.IsNullOrEmpty(dto.Phone1))
                existing.Phone1 = dto.Phone1;

            if (dto.Phone2 != null)
                existing.Phone2 = dto.Phone2;

            if (dto.Description != null)
                existing.Description = dto.Description;

            if (!string.IsNullOrEmpty(dto.Status) && Enum.TryParse<PostStatus>(dto.Status, true, out var status))
                existing.Status = status;

            var updated = await _repository.UpdateAsync(id, existing);
            _logger.LogInformation("Updated bulletin post with ID: {PostId}", id);
            return updated != null ? await MapToDtoAsync(updated) : null;
        }

        public async Task<bool> DeletePostAsync(string id)
        {
            var result = await _repository.DeleteAsync(id);
            if (result)
            {
                _logger.LogInformation("Deleted bulletin post with ID: {PostId}", id);
            }
            else
            {
                _logger.LogWarning("Attempted to delete non-existent post with ID: {PostId}", id);
            }
            return result;
        }

        public async Task<bool> ChangePostStatusAsync(string id, string status)
        {
            if (!Enum.TryParse<PostStatus>(status, true, out var postStatus))
            {
                throw new ArgumentException($"Invalid status: {status}");
            }

            var post = await _repository.GetByIdAsync(id);
            if (post == null)
                return false;

            post.Status = postStatus;
            var updated = await _repository.UpdateAsync(id, post);
            
            if (updated != null)
            {
                _logger.LogInformation("Changed status of post {PostId} to {Status}", id, status);
            }

            return updated != null;
        }

        private async Task<BulletinPostDto> MapToDtoAsync(BulletinPost post)
        {
            User? user = null;
            if (!string.IsNullOrEmpty(post.CreatedBy))
            {
                user = await _userRepository.GetByIdAsync(post.CreatedBy);
            }

            return new BulletinPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Category = post.Category,
                SubCategory = post.SubCategory,
                Price = post.Price,
                ImageUrl = post.ImageUrl,
                Location = new LocationInfoDto
                {
                    City = post.Location.City,
                    Area = post.Location.Area,
                    Street = post.Location.Street,
                    Latitude = post.Location.Latitude,
                    Longitude = post.Location.Longitude
                },
                OwnerName = post.OwnerName,
                Phone1 = post.Phone1,
                Phone2 = post.Phone2,
                Description = post.Description,
                Status = post.Status.ToString(),
                CreatedAt = post.CreatedAt,
                CreatedBy = post.CreatedBy,
                ProfileImageUrl = user?.ProfileImageUrl
            };
        }
    }
}
