import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPost extends Document {
  title: string;
  description: string;
  mainImage?: string;
  authorId: mongoose.Types.ObjectId;
  tags: string[];
  status: 'Draft' | 'Published' | 'Trash';
  date: string;
  dayOfWeek: string;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    mainImage: { type: String },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['Draft', 'Published', 'Trash'], default: 'Draft' },
    date: { type: String, required: true },
    dayOfWeek: { type: String, required: true },
  },
  { timestamps: true }
);

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
