using Backend.Models;

namespace Backend.Interfaces
{
    public interface IBulletinPostRepository
    {
        Task<IEnumerable<BulletinPost>> GetAllAsync();
        Task<BulletinPost?> GetByIdAsync(string id);
        Task<IEnumerable<BulletinPost>> GetByCategoryAsync(string category);
        Task<IEnumerable<BulletinPost>> GetByCityAsync(string city);
        Task<IEnumerable<BulletinPost>> GetByStatusAsync(PostStatus status);
        Task<IEnumerable<BulletinPost>> SearchAsync(string? category = null, string? subCategory = null, 
            decimal? minPrice = null, decimal? maxPrice = null, string? city = null, string? area = null, 
            string? address = null, PostStatus? status = null, string? searchText = null, 
            DateTime? fromDate = null, DateTime? toDate = null, double? latitude = null, double? longitude = null, double? radiusKm = null);
        Task<BulletinPost> CreateAsync(BulletinPost post);
        Task<BulletinPost?> UpdateAsync(string id, BulletinPost post);
        Task<bool> DeleteAsync(string id);
        Task<bool> ExistsAsync(string id);
    }
}
