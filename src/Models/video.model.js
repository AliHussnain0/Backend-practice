import mongoose, { Schema,model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const VideoSchema = new Schema({

    videoFile: {
        type: String,
        required: true,
    },
    thumbNail: {
        type: String,
        required:true,
    },
    title: {
        type: String,
        required:true,
    },
    description: {
        type:String,
    },
    views: {
        type: Number,
        default: 0,  
    },
    likes: {
        type: Number,
        default:0,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    IsPublished: {
        type: Boolean,
        default: false,
    }
}, { timestamps });

//some plugin that we will using while writing queries for Video schema.

VideoSchema.plugin(mongooseAggregatePaginate);

export const Video = model('Video', VideoSchema);
