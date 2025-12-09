import { MatDialog } from '@angular/material/dialog';
import { PostDetailsComponent } from '../post-details/post-details.component';
import { Component, OnInit } from '@angular/core';
import { BulletinPost } from 'src/app/models/bulletin-post.model';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-posts-board',
  templateUrl: './posts-board.component.html',
  styleUrls: ['./posts-board.component.css']
})
export class PostsBoardComponent implements OnInit {
  posts: BulletinPost[] = [];
  allPosts: BulletinPost[] = [];
  loading = false;
  error = '';
  currentUserId: string | null = null;
  currentUser: any = null;
  apiUrl = environment.apiUrl;

  constructor(
    private dialog: MatDialog,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPosts();
    this.auth.currentUser$.subscribe(user => {
      this.currentUserId = user?.id || null;
      this.currentUser = user;
    });
  }

  onSearchResults(results: BulletinPost[]): void {
      this.posts = results;
  }
  
  onClearFilter(): void {
    this.posts = [...this.allPosts];
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  canEditPost(post: BulletinPost): boolean {
    return this.currentUserId !== null && post.createdBy === this.currentUserId;
  }

  loadPosts(): void {
    this.loading = true;
    this.error = '';
    this.api.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.allPosts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'שגיאה בטעינת מודעות: ' + err.message;
        this.loading = false;
        console.error('Error loading posts', err);
      }
    });
  }

  createNewPost() {
    const dialogRef = this.dialog.open(PostDetailsComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'post-details-dialog',
      data: { mode: 'create', post: null, currentUser: this.currentUser }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the posts list after creating a new post
        this.loadPosts();
      }
    });
  }

  editPost(post: BulletinPost) {
    const dialogRef = this.dialog.open(PostDetailsComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'post-details-dialog',
      data: { mode: 'edit', post: post }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the posts list after editing
        this.loadPosts();
      }
    });
  }

  deletePost(postId: string) {
    if (confirm('האם אתה בטוח שברצונך למחוק מודעה זו?')) {
      this.api.deletePost(postId).subscribe({
        next: () => {
          this.loadPosts();
        },
        error: (err) => {
          alert('שגיאה במחיקת מודעה: ' + err.message);
          console.error('Error deleting post', err);
        }
      });
    }
  }
}
