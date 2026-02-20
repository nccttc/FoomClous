import { query } from '../db/index.js';

async function addFavoritesField() {
    try {
        console.log('开始添加 is_favorite 字段...');
        
        // 检查字段是否已存在
        const checkResult = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'files' 
            AND column_name = 'is_favorite'
        `);
        
        if (checkResult.rows.length > 0) {
            console.log('is_favorite 字段已存在，跳过迁移');
            return;
        }
        
        // 添加 is_favorite 字段
        await query(`
            ALTER TABLE files 
            ADD COLUMN is_favorite BOOLEAN DEFAULT false
        `);
        
        // 添加索引以提高查询性能
        await query(`
            CREATE INDEX IF NOT EXISTS idx_files_is_favorite 
            ON files(is_favorite)
        `);
        
        console.log('✅ 成功添加 is_favorite 字段和索引');
        
    } catch (error) {
        console.error('❌ 添加 is_favorite 字段失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    addFavoritesField()
        .then(() => {
            console.log('迁移完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('迁移失败:', error);
            process.exit(1);
        });
}

export { addFavoritesField };
