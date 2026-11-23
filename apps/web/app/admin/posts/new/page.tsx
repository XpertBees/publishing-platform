import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PostForm } from "@/components/admin/post-form";

export default function NewPostPage() {
  return (
    <div>
      <AdminPageHeader title="New post" description="Fill in the post details below." />
      <PostForm />
    </div>
  );
}
