const repos = [
    'Eikanya/Live2d-model',
    'guansss/pixi-live2d-display',
];

const folderBlacklist = [
    // mature models... _(:ι」∠)_
    'Eikanya/Live2d-model/galgame live2d/UnHolY ToRturEr',
    'Eikanya/Live2d-model/galgame live2d/LOVE³-LOVE CUBE-',
    'Eikanya/Live2d-model/galgame live2d/[200228] [North Box] モノノ系彼女',
    'Eikanya/Live2d-model/galgame live2d/[200229][同人ゲーム][マメック星] 雑貨屋さんの若女将 [RJ279692]',
    'Eikanya/Live2d-model/galgame live2d/[200328][虚夢浮遊物体] ソムニア掌編―薔薇色― [RJ282471]',
    'Eikanya/Live2d-model/galgame live2d/[200502][らぷらす] プリンセスハーレム [RJ280657]',
    'Eikanya/Live2d-model/galgame live2d/[MountBatten] Live2Dで動くイソップ寓話',
    'Eikanya/Live2d-model/galgame live2d/[ぬぷ竜の里] ルインズシーカー live2d',
    'Eikanya/Live2d-model/galgame live2d/[めがみそふと] 【Live2D】コン狐との日常+(ぷらす)',
    'Eikanya/Live2d-model/galgame live2d/カスタムcute ～俺と彼女の育成バトル！～',
    'Eikanya/Live2d-model/galgame live2d/異世界で俺はエロ経営のトップになる！',
    'Eikanya/Live2d-model/galgame live2d/神楽黎明記～Live2d',
];

const fileBlacklist = [
    // broken file
    'Eikanya/Live2d-model/Sacred Sword princesses/model.json',

    // mature models
    'Eikanya/Live2d-model/Sacred Sword princesses/boss_cg_live2d_h004/.model.json',
    'Eikanya/Live2d-model/Sacred Sword princesses/char_cg_live2d_h048/.model.json',

    // non-model zip
    'Eikanya/Live2d-model/少女咖啡枪 girls cafe gun/UnityLive2DExtractor+for+ガール・カフェ・ガン.zip',
];

const mocWhitelist = [
    // these moc files are already specified in their settings files
    'Eikanya/Live2d-model/Sacred Sword princesses/boss_cg_live2d_h004/res/iderhelamodel.moc',
    'Eikanya/Live2d-model/Sacred Sword princesses/char_cg_live2d_007/res/dorlamodel.moc',
    'Eikanya/Live2d-model/Sacred Sword princesses/char_cg_live2d_049/res/airmanirmodel.moc',
    'Eikanya/Live2d-model/Sacred Sword princesses/char_cg_live2d_h048/res/ainir.moc',
];

module.exports = {
    repos,
    folderBlacklist,
    fileBlacklist,
    mocWhitelist,
}
