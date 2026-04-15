export const MENU_DEFINITIONS = {
    MAIN_MENU: [
        { id: 'play', text: 'PLAY', action: 'startGame', style: 'default' },
        { id: 'settings', text: 'SETTINGS', action: 'openSettingsMenu', args: ['menu'], style: 'default' }
    ],
    SETTINGS_MENU: {
        tabs: [
            { id: 'performance', text: 'Performance', action: 'setSettingsTab', args: ['performance'], style: 'tab' },
            { id: 'gameplay', text: 'Gameplay', action: 'setSettingsTab', args: ['gameplay'], style: 'tab' },
            { id: 'audio', text: 'Audio (WIP)', action: 'setSettingsTab', args: ['audio'], style: 'tab' }
        ],
        body: {
            performance: [
                {
                    id: 'particles',
                    type: 'toggle',
                    label: 'Particle Effects',
                    path: ['performance', 'particles']
                },
                {
                    id: 'enemyHealthBars',
                    type: 'toggle',
                    label: 'Enemy Health Bars',
                    path: ['performance', 'enemyHealthBars']
                }
            ],
            gameplay: [
                {
                    id: 'autoFire',
                    type: 'toggle',
                    label: 'Auto-Fire',
                    path: ['gameplay', 'autoFire']
                },
                {
                    id: 'resumeCooldown',
                    type: 'toggle',
                    label: 'Cooldown after pause',
                    path: ['gameplay', 'resumeCooldown']
                },
                {
                    id: 'crosshairColor',
                    type: 'swatch',
                    label: 'Cursor Color',
                    path: ['gameplay', 'crosshairColor'],
                    options: ['#000000', '#ffffff', '#00ffcc', '#ff55aa', '#55ff55', '#ffff55', '#ff5500']
                },
                {
                    id: 'cursorSize',
                    type: 'slider',
                    label: 'Cursor Size',
                    path: ['gameplay', 'cursorSize'],
                    min: 0.5,
                    max: 2,
                    step: 0.1
                },
                {
                    id: 'cursorWidth',
                    type: 'slider',
                    label: 'Cursor Width',
                    path: ['gameplay', 'cursorWidth'],
                    min: 1,
                    max: 6,
                    step: 1
                },
                {
                    id: 'cursorBorderWidth',
                    type: 'slider',
                    label: 'Border Width',
                    path: ['gameplay', 'cursorBorderWidth'],
                    min: 1,
                    max: 10,
                    step: 1
                },
                {
                    id: 'cursorBorderColor',
                    type: 'swatch',
                    label: 'Border Color',
                    path: ['gameplay', 'cursorBorderColor'],
                    options: ['#000000', '#ffffff', '#00ffcc', '#ff55aa', '#55ff55', '#ffff55', '#ff5500']
                },
                {
                    id: 'cursorSkin',
                    type: 'selection',
                    label: 'Crosshair Style',
                    path: ['gameplay', 'cursorSkin'],
                    options: ['classic', 'dot', 'circle']
                }
            ],
            audio: [
                {
                    id: 'audio_placeholder',
                    type: 'label',
                    label: 'Audio settings are work in progress.'
                }
            ]
        },
        footer: [
            { id: 'settings_back', text: 'BACK', action: 'closeSettingsMenu', style: 'default' }
        ]
    },
    GAME_OVER_MENU: [
        { id: 'play_again', text: 'PLAY AGAIN', action: 'startGame', style: 'danger' },
        { id: 'main_menu', text: 'MAIN MENU', action: 'returnToMainMenu', style: 'default' }
    ],
    PAUSE_MENU: [
        { id: 'continue', text: 'CONTINUE', action: 'resumeGame', style: 'default' },
        { id: 'settings', text: 'SETTINGS', action: 'openSettingsMenu', args: ['pause'], style: 'default' },
        { id: 'restart', text: 'RESTART', action: 'reloadGame', style: 'default' }
    ],
    UPGRADES_MENU: [
        { id: 'upgrade_slot_1', text: 'Upgrade Option 1', action: 'selectUpgrade', style: 'card' },
        { id: 'upgrade_slot_2', text: 'Upgrade Option 2', action: 'selectUpgrade', style: 'card' },
        { id: 'upgrade_slot_3', text: 'Upgrade Option 3', action: 'selectUpgrade', style: 'card' }
    ]
};
