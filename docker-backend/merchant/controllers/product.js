const { pool } = require('../config/database');

/**
 * 获取商品列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getProducts(req, res) {
    const connection = await pool.getConnection();
    try {
        const {
            page = 1,
            pageSize = 10,
            category_id,
            keyword,
            is_featured,
            status,
            sort = 'create_time',
            order = 'DESC'
        } = req.query;

        let conditions = ['1=1'];
        let params = [];

        if (category_id) {
            conditions.push('category_id = ?');
            params.push(category_id);
        }

        if (keyword) {
            conditions.push('(name LIKE ? OR description LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (is_featured !== undefined) {
            conditions.push('is_featured = ?');
            params.push(is_featured === 'true' ? 1 : 0);
        }

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }

        const offset = (page - 1) * pageSize;
        
        // 获取总数
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM products WHERE ${conditions.join(' AND ')}`,
            params
        );
        const total = countResult[0].total;

        // 获取商品列表
        const [products] = await connection.execute(
            `SELECT p.*, 
                    GROUP_CONCAT(DISTINCT pi.image_url) as image_urls,
                    COUNT(DISTINCT pf.id) as favorite_count
             FROM products p
             LEFT JOIN product_images pi ON p.id = pi.product_id
             LEFT JOIN product_favorites pf ON p.id = pf.product_id
             WHERE ${conditions.join(' AND ')}
             GROUP BY p.id
             ORDER BY ${sort} ${order}
             LIMIT ? OFFSET ?`,
            [...params, parseInt(pageSize), offset]
        );

        res.json({
            code: 0,
            message: '获取商品列表成功',
            data: {
                total,
                list: products.map(product => ({
                    ...product,
                    image_urls: product.image_urls ? product.image_urls.split(',') : []
                })),
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取商品列表失败:', error);
        res.status(500).json({
            code: 500,
            message: '获取商品列表失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
}

/**
 * 获取商品详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getProductDetail(req, res) {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        // 增加浏览次数
        await connection.execute(
            'UPDATE products SET view_count = view_count + 1 WHERE id = ?',
            [id]
        );

        // 获取商品详情
        const [products] = await connection.execute(
            `SELECT p.*, 
                    GROUP_CONCAT(DISTINCT pi.image_url) as image_urls,
                    COUNT(DISTINCT pf.id) as favorite_count
             FROM products p
             LEFT JOIN product_images pi ON p.id = pi.product_id
             LEFT JOIN product_favorites pf ON p.id = pf.product_id
             WHERE p.id = ?
             GROUP BY p.id`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                code: 404,
                message: '商品不存在'
            });
        }

        const product = {
            ...products[0],
            image_urls: products[0].image_urls ? products[0].image_urls.split(',') : []
        };

        res.json({
            code: 0,
            message: '获取商品详情成功',
            data: product
        });
    } catch (error) {
        console.error('获取商品详情失败:', error);
        res.status(500).json({
            code: 500,
            message: '获取商品详情失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
}

/**
 * 创建商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function createProduct(req, res) {
    const connection = await pool.getConnection();
    try {
        const {
            category_id,
            name,
            description,
            price,
            stock,
            images,
            status = 'off_sale',
            is_featured = false,
            location_lat,
            location_lng,
            location_name,
            season_start,
            season_end
        } = req.body;

        // 开始事务
        await connection.beginTransaction();

        // 创建商品
        const [result] = await connection.execute(
            `INSERT INTO products (
                category_id, name, description, price, stock, status,
                is_featured, location_lat, location_lng, location_name,
                season_start, season_end, create_time, update_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                category_id, name, description, price, stock, status,
                is_featured, location_lat, location_lng, location_name,
                season_start, season_end
            ]
        );

        const productId = result.insertId;

        // 保存商品图片
        if (images && images.length > 0) {
            const imageValues = images.map((url, index) => [productId, url, index]);
            await connection.execute(
                'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ?',
                [imageValues]
            );
        }

        // 提交事务
        await connection.commit();

        res.json({
            code: 0,
            message: '创建商品成功',
            data: { id: productId }
        });
    } catch (error) {
        // 回滚事务
        await connection.rollback();
        console.error('创建商品失败:', error);
        res.status(500).json({
            code: 500,
            message: '创建商品失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
}

/**
 * 更新商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function updateProduct(req, res) {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const {
            category_id,
            name,
            description,
            price,
            stock,
            images,
            status,
            is_featured,
            location_lat,
            location_lng,
            location_name,
            season_start,
            season_end
        } = req.body;

        // 开始事务
        await connection.beginTransaction();

        // 更新商品基本信息
        const updateFields = [];
        const updateValues = [];

        if (category_id !== undefined) {
            updateFields.push('category_id = ?');
            updateValues.push(category_id);
        }
        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (price !== undefined) {
            updateFields.push('price = ?');
            updateValues.push(price);
        }
        if (stock !== undefined) {
            updateFields.push('stock = ?');
            updateValues.push(stock);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (is_featured !== undefined) {
            updateFields.push('is_featured = ?');
            updateValues.push(is_featured);
        }
        if (location_lat !== undefined) {
            updateFields.push('location_lat = ?');
            updateValues.push(location_lat);
        }
        if (location_lng !== undefined) {
            updateFields.push('location_lng = ?');
            updateValues.push(location_lng);
        }
        if (location_name !== undefined) {
            updateFields.push('location_name = ?');
            updateValues.push(location_name);
        }
        if (season_start !== undefined) {
            updateFields.push('season_start = ?');
            updateValues.push(season_start);
        }
        if (season_end !== undefined) {
            updateFields.push('season_end = ?');
            updateValues.push(season_end);
        }

        updateFields.push('update_time = NOW()');

        if (updateFields.length > 0) {
            await connection.execute(
                `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
                [...updateValues, id]
            );
        }

        // 更新商品图片
        if (images !== undefined) {
            // 删除旧图片
            await connection.execute(
                'DELETE FROM product_images WHERE product_id = ?',
                [id]
            );

            // 添加新图片
            if (images && images.length > 0) {
                const imageValues = images.map((url, index) => [id, url, index]);
                await connection.execute(
                    'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ?',
                    [imageValues]
                );
            }
        }

        // 提交事务
        await connection.commit();

        res.json({
            code: 0,
            message: '更新商品成功'
        });
    } catch (error) {
        // 回滚事务
        await connection.rollback();
        console.error('更新商品失败:', error);
        res.status(500).json({
            code: 500,
            message: '更新商品失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
}

/**
 * 删除商品
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function deleteProduct(req, res) {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        // 开始事务
        await connection.beginTransaction();

        // 删除商品图片
        await connection.execute(
            'DELETE FROM product_images WHERE product_id = ?',
            [id]
        );

        // 删除商品收藏
        await connection.execute(
            'DELETE FROM product_favorites WHERE product_id = ?',
            [id]
        );

        // 删除商品浏览记录
        await connection.execute(
            'DELETE FROM product_views WHERE product_id = ?',
            [id]
        );

        // 删除商品
        await connection.execute(
            'DELETE FROM products WHERE id = ?',
            [id]
        );

        // 提交事务
        await connection.commit();

        res.json({
            code: 0,
            message: '删除商品成功'
        });
    } catch (error) {
        // 回滚事务
        await connection.rollback();
        console.error('删除商品失败:', error);
        res.status(500).json({
            code: 500,
            message: '删除商品失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
}

/**
 * 批量更新商品状态
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function batchUpdateStatus(req, res) {
    const connection = await pool.getConnection();
    try {
        const { ids, status } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                code: 400,
                message: '商品ID列表不能为空'
            });
        }

        await connection.execute(
            'UPDATE products SET status = ?, update_time = NOW() WHERE id IN (?)',
            [status, ids]
        );

        res.json({
            code: 0,
            message: '批量更新商品状态成功'
        });
    } catch (error) {
        console.error('批量更新商品状态失败:', error);
        res.status(500).json({
            code: 500,
            message: '批量更新商品状态失败',
            error: error.message
        });
    } finally {
        connection.release();
    }
}

module.exports = {
    getProducts,
    getProductDetail,
    createProduct,
    updateProduct,
    deleteProduct,
    batchUpdateStatus
}; 