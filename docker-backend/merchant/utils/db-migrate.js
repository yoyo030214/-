const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
    let connection;
    try {
        console.log('正在连接数据库...');
        connection = await pool.getConnection();
        console.log('数据库连接成功');

        // 读取迁移文件
        const migrationFiles = fs.readdirSync(path.join(__dirname, '../sql/migrations'))
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of migrationFiles) {
            console.log(`执行迁移文件: ${file}`);
            const sql = fs.readFileSync(
                path.join(__dirname, '../sql/migrations', file),
                'utf8'
            );

            // 分割SQL语句
            const statements = sql.split(';').filter(stmt => stmt.trim());

            // 执行每条SQL语句
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await connection.execute(statement);
                        console.log('SQL语句执行成功');
                    } catch (error) {
                        if (error.code === 'ER_DUP_FIELDNAME') {
                            console.log('字段已存在，跳过');
                        } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                            console.log('表已存在，跳过');
                        } else if (error.code === 'ER_DUP_KEYNAME') {
                            console.log('索引已存在，跳过');
                        } else {
                            throw error;
                        }
                    }
                }
            }

            console.log(`迁移文件 ${file} 执行完成`);
        }

        console.log('所有迁移完成');
    } catch (error) {
        console.error('迁移失败:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
            console.log('数据库连接已释放');
        }
    }
}

// 执行迁移
console.log('开始执行数据库迁移...');
runMigrations()
    .then(() => {
        console.log('数据库迁移成功完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('数据库迁移失败:', error);
        process.exit(1);
    }); 