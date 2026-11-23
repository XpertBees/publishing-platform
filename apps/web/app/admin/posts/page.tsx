import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PostsTable } from "@/components/admin/posts-table";

export default function PostsPage() {
  return (
    <div>
      <AdminPageHeader title="Posts" description="Create, edit, publish and schedule posts." />
      <PostsTable />
    </div>
  );
}
