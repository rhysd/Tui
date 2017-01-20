type KeymapsConfig = {[keyseq: string]: KeymapName};

interface Config {
    hot_key: string;
    icon_color: 'black' | 'white';
    always_on_top: boolean;
    normal_window: boolean;
    zoom_factor: number;
    home_url: string;
    notification: boolean;
    smooth_scroll: boolean;
    plugins: string[];
    keymaps: KeymapsConfig;
    accounts?: string[] | null;
}
