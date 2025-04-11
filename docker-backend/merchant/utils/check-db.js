const { pool } = require('../config/database');

async function checkDatabaseStructure() {
    let connection;
    try {
        console.log('正在连接数据库...');
        connection = await pool.getConnection();
        console.log('数据库连接成功');

        // 检查products表结构
        console.log('\n检查商品表(products)结构...');
        const [productColumns] = await connection.execute('SHOW COLUMNS FROM products');
        console.log('商品表字段列表:');
        productColumns.forEach(column => {
            console.log(`- ${column.Field}: ${column.Type} (${column.Comment || '无注释'})`);
        });

        // 检查product_images表是否存在
        console.log('\n检查商品图片表...');
        const [tables] = await connection.execute('SHOW TABLES LIKE "product_images"');
        if (tables.length > 0) {
            console.log('商品图片表已存在');
            const [imageColumns] = await connection.execute('SHOW COLUMNS FROM product_images');
            console.log('商品图片表字段列表:');
            imageColumns.forEach(column => {
                console.log(`- ${column.Field}: ${column.Type} (${column.Comment || '无注释'})`);
            });
        } else {
            console.log('商品图片表不存在');
        }

        // 检查product_favorites表是否存在
        console.log('\n检查商品收藏表...');
        const [favoritesTables] = await connection.execute('SHOW TABLES LIKE "product_favorites"');
        if (favoritesTables.length > 0) {
            console.log('商品收藏表已存在');
            const [favoritesColumns] = await connection.execute('SHOW COLUMNS FROM product_favorites');
            console.log('商品收藏表字段列表:');
            favoritesColumns.forEach(column => {
                console.log(`- ${column.Field}: ${column.Type} (${column.Comment || '无注释'})`);
            });
        } else {
            console.log('商品收藏表不存在');
        }

        // 检查product_views表是否存在
        console.log('\n检查商品浏览记录表...');
        const [viewsTables] = await connection.execute('SHOW TABLES LIKE "product_views"');
        if (viewsTables.length > 0) {
            console.log('商品浏览记录表已存在');
            const [viewsColumns] = await connection.execute('SHOW COLUMNS FROM product_views');
            console.log('商品浏览记录表字段列表:');
            viewsColumns.forEach(column => {
                console.log(`- ${column.Field}: ${column.Type} (${column.Comment || '无注释'})`);
            });
        } else {
            console.log('商品浏览记录表不存在');
        }

        // 检查product_sales表是否存在
        console.log('\n检查商品销售记录表...');
        const [salesTables] = await connection.execute('SHOW TABLES LIKE "product_sales"');
        if (salesTables.length > 0) {
            console.log('商品销售记录表已存在');
            const [salesColumns] = await connection.execute('SHOW COLUMNS FROM product_sales');
            console.log('商品销售记录表字段列表:');
            salesColumns.forEach(column => {
                console.log(`- ${column.Field}: ${column.Type} (${column.Comment || '无注释'})`);
            });
        } else {
            console.log('商品销售记录表不存在');
        }

        // 检查索引
        console.log('\n检查商品表索引...');
        const [indexes] = await connection.execute('SHOW INDEX FROM products');
        console.log('商品表索引列表:');
        indexes.forEach(index => {
            console.log(`- ${index.Key_name}: ${index.Column_name} (${index.Index_type})`);
        });

    } catch (error) {
        console.error('检查数据库结构时出错:', error.message);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('提示: 表不存在，可能需要先创建表');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('提示: 数据库访问权限不足，请检查用户名和密码');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('提示: 无法连接到数据库服务器，请检查服务器地址和端口');
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
            console.log('\n数据库连接已释放');
        }
    }
}

// 执行检查
console.log('开始检查数据库结构...');
checkDatabaseStructure()
    .then(() => {
        console.log('\n数据库结构检查完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n数据库结构检查失败:', error);
        process.exit(1);
    }); 