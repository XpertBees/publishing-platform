import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PostsTable } from "@/components/admin/posts-table";

export default function SponsoredPage() {
  return (
    <div>
      <AdminPageHeader
        title="Sponsored posts"
        description="Posts flagged as sponsored. Create and edit them from the Posts section."
      />
      <PostsTable sponsoredOnly />
    </div>
  );
}
