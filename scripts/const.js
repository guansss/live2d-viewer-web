const repos = [
    'Eikanya/Live2d-model',
    'guansss/pixi-live2d-display',
];

const folderBlacklist = [
    // mature models... _(:ι」∠)_
    'UnHolY ToRturEr',
    'LOVE³-LOVE CUBE-',
    '[200228] [North Box] モノノ系彼女',
    '[200229][同人ゲーム][マメック星] 雑貨屋さんの若女将 [RJ279692]',
    '[200328][虚夢浮遊物体] ソムニア掌編―薔薇色― [RJ282471]',
    '[200502][らぷらす] プリンセスハーレム [RJ280657]',
    '[MountBatten] Live2Dで動くイソップ寓話',
    '[ぬぷ竜の里] ルインズシーカー live2d',
    '[めがみそふと] 【Live2D】コン狐との日常+(ぷらす)',
    'カスタムcute ～俺と彼女の育成バトル！～',
    '異世界で俺はエロ経営のトップになる！',
    '神楽黎明記～Live2d',
];

const fileBlacklist = [
    // broken file
    "Sacred Sword princesses/model.json",

    // non-model zip
    '少女咖啡枪 girls cafe gun/UnityLive2DExtractor+for+ガール・カフェ・ガン.zip',
];

const mocWhitelist = [
    // these moc files are already specified in their settings files
    "Sacred Sword princesses/boss_cg_live2d_h004/res/iderhelamodel.moc",
    "Sacred Sword princesses/char_cg_live2d_007/res/dorlamodel.moc",
    "Sacred Sword princesses/char_cg_live2d_049/res/airmanirmodel.moc",
    "Sacred Sword princesses/char_cg_live2d_h048/res/ainir.moc",
];

module.exports = {
    repos,
    folderBlacklist,
    fileBlacklist,
    mocWhitelist,
}
