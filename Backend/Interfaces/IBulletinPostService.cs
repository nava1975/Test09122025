using Backend.DTOs;

namespace Backend.Interfaces
{
    public interface IBulletinPostService
    {
        Task<IEnumerable<BulletinPostDto>> GetAllPostsAsync();
        Task<BulletinPostDto?> GetPostByIdAsync(string id);
        Task<IEnumerable<BulletinPostDto>> GetPostsByCategoryAsync(string category);
        Task<IEnumerable<BulletinPostDto>> GetPostsByCityAsync(string city);
        Task<IEnumerable<BulletinPostDto>> GetPostsByStatusAsync(string status);
        Task<IEnumerable<BulletinPostDto>> SearchPostsAsync(BulletinPostFilterDto filter);
        Task<BulletinPostDto> CreatePostAsync(CreateBulletinPostDto dto, string? imageUrl = null, string? userId = null);
        Task<BulletinPostDto?> UpdatePostAsync(string id, UpdateBulletinPostDto dto, string? imageUrl = null);
        Task<bool> DeletePostAsync(string id);
        Task<bool> ChangePostStatusAsync(string id, string status);
    }
}
