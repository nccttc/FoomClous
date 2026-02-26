const getApiBase = () => {
    // 优先使用构建时注入的变量
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl !== 'http://localhost:51947' && envUrl !== '') {
        return envUrl;
    }

    // 如果在生产环境且没有配置，fallback 到相对路径（同域代理模式）
    if (import.meta.env.PROD) {
        return '';
    }
    return 'http://localhost:51947';
};

export const API_BASE = getApiBase();
console.log('🚀 FoomClous API_BASE:', API_BASE || '(relative path)');
