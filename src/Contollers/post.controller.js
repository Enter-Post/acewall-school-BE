import Posts from "../Models/post.model.js";

export const createPost = async (req, res) => {
    const { text, color } = req.body
    const assets = req.files
    const author = req.user._id

    try {
        if (!req.files) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const uploadedFiles = []

        assets.forEach(asset => {
            let fileType = 'file';
            if (asset.mimetype.startsWith('video/')) fileType = 'videos';
            else if (asset.mimetype.startsWith('image/')) fileType = 'image';

            const fileUrl = `${process.env.ASSET_URL}uploads/${fileType}/${asset.filename}`;

            uploadedFiles.push({
                url: fileUrl,
                type: asset.mimetype,
                filename: asset.originalname,
            });
        });

        const post = new Posts({
            text,
            assets: uploadedFiles,
            author,
            color
        });

        await post.save()

        res.json({
            message: 'File uploaded successfully',
        });
    } catch (error) {
        console.log("Error uploading file:", error);
        res.status(500).json({ message: 'Internal Server error' });
    }
}

export const getPosts = async (req, res) => {
    try {
        // 🧩 Extract pagination params (with defaults)
        const page = parseInt(req.query.page) || 1;     // default: 1
        const limit = parseInt(req.query.limit) || 10;  // default: 10

        // 🧮 Calculate skip value
        const skip = (page - 1) * limit;

        // 🔍 Fetch total count
        const totalPosts = await Posts.countDocuments();

        // 📄 Fetch paginated posts
        const posts = await Posts.find()
            .populate('author', 'firstName middleName lastName profileImg')
            .sort({ createdAt: -1 }) // newest first
            .skip(skip)
            .limit(limit);

        // 🧾 Calculate total pages
        const totalPages = Math.ceil(totalPosts / limit);

        // ✅ Send response
        res.json({
            currentPage: page,
            totalPages,
            totalPosts,
            limit,
            posts,
        });

    } catch (error) {
        console.error("Error in getPosts:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};