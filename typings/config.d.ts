type KeymapsConfig = {[keyseq: string]: KeymapName};

interface Config {
    hot_key: string;
    icon_color: 'black' | 'white';
    always_on_top: boolean;
    normal_window: boolean;
    zoom_factor: number;
    home_url: string;
    notification: boolean;
    refresh_on_sleep: boolean;
    refresh_threshold_memory_mb: number;
    plugins: string[];
    keymaps: KeymapsConfig;
    accounts?: string[] | null;
}
