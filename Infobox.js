export function getFormattedStats(player) {
    const getBonus = (current, base) => {
        const percent = ((current / base) - 1) * 100;
        if (percent > 0) return `+${percent.toFixed(0)}%`;
        if (percent < 0) return `${percent.toFixed(0)}%`;
        return "+0%";
    };

    return [
        { label: "MAX HP", val: player.stats.maxHp },
        { label: "DEFENSE", val: player.stats.defense },
        { label: "DODGE CHANCE", val: (player.stats.dodgeChance * 100).toFixed(0) + "%" },
        { label: "DAMAGE", val: player.getStat('damage').toFixed(1) },
        { label: "FIRE RATE", val: (1000 / player.getStat('fireRate')).toFixed(1) + "/s" + " (" + getBonus(1000 / player.getStat('fireRate'), 1000 / player.baseStats.fireRate) + ")" },
        { label: "PROJ. SPEED", val: player.getStat('bulletSpeed').toFixed(1) + " (" + getBonus(player.getStat('bulletSpeed'), player.baseStats.bulletSpeed) + ")" },
        { label: "PROJ. SIZE", val: (player.getStat('projectileSize') * 100).toFixed(0) + "%" },
        { label: "PROJ. COUNT", val: player.stats.projectileCount },
        { label: "PENETRATION", val: player.stats.penetration },
        { label: "RICOCHET", val: player.stats.ricochetCount },
        { label: "CRIT CHANCE", val: (player.stats.critChance * 100).toFixed(0) + "%" },
        { label: "CRIT MULTI", val: player.getStat('critMultiplier').toFixed(1) + "x" },
        { label: "MOVE SPEED", val: getBonus(player.getStat('moveSpeed'), player.baseStats.moveSpeed) },
        { label: "MAGNET", val: getBonus(player.getStat('magnetRange'), player.baseStats.magnetRange) },
        { label: "LUCK", val: getBonus(player.getStat('luck'), player.baseStats.luck) },
        { label: "XP GAIN", val: getBonus(player.getStat('xpMultiplier'), player.baseStats.xpMultiplier) },
        { label: "MAX DRONES", val: player.stats.maxDrones }
    ];
}