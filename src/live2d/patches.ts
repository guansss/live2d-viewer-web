import {
    Cubism2ModelSettings,
    Cubism2Spec,
    Cubism4ModelSettings,
    CubismSpec,
    Live2DFactory,
    Live2DFactoryContext,
    urlToJSON as defaultURLToJSON,
} from 'pixi-live2d-display';
import JSON5 from 'json5';
import { ping } from '@/utils';
import { url as urlUtils } from '@pixi/utils';
import { getSettingsJSON } from './data';
import { CommonModelJSON } from '@/global';
import { isMocFile, isMocFileV3 } from '@/live2d/helpers';

// replace the default urlToJSON middleware
Live2DFactory.live2DModelMiddlewares.splice(Live2DFactory.live2DModelMiddlewares.indexOf(defaultURLToJSON), 1, urlToJSON);

async function urlToJSON(context: Live2DFactoryContext, next: (err?: any) => Promise<void>) {
    if (typeof context.source === 'string') {

        const url = context.source;

        let json: CommonModelJSON;

        if (isMocFile(url)) {
            json = getSettingsJSON(url) as NonNullable<ReturnType<typeof getSettingsJSON>>;

            if (!json) {
                throw new Error('Cannot find settings JSON from moc');
            }

            if (isMocFileV3(url)) {
                json.url = urlUtils.resolve(url, 'dummy.model3.json');

                const json3 = json as CubismSpec.ModelJSON;

                json3.FileReferences.Moc = url;

                // construct motion definitions from the plain string array
                if (json3.FileReferences.Motions?.['']?.length && typeof json3.FileReferences.Motions[''][0] === 'string') {
                    json3.FileReferences.Motions[''] = json3.FileReferences.Motions[''].map(
                        motionFile => ({ File: motionFile as any as string }),
                    );
                }
            } else {
                json.url = urlUtils.resolve(url, 'dummy.model.json');

                const json2 = json as Cubism2Spec.ModelJSON;

                json2.model = url;

                // construct motion definitions from the plain string array
                if (json2.motions?.['']?.length && typeof json2.motions[''][0] === 'string') {
                    json2.motions[''] = json2.motions[''].map(
                        motionFile => ({ file: motionFile as any as string }),
                    );
                }
            }
        } else {
            let jsonText = await fetch(url).then(res => res.text());

            jsonText = replaceJSONText(jsonText, url);

            // some JSONs are poorly formatted, but can possibly be parsed by JSON5
            json = JSON5.parse(jsonText);

            json.url = url;
        }

        await patchJSON(json, url);

        setSingleMotionAsIdle(json);

        context.source = json;

        console.log(json);

        context.live2dModel.emit('settingsJSONLoaded', json);
    }

    return next();
}

function replaceJSONText(jsonText: string, url: string) {
    for (const patch of patches) {
        if (url.includes(encodeURI(patch.search)) && patch.replace) {
            jsonText = patch.replace(jsonText, url);
        }
    }

    return jsonText;
}

async function patchJSON(json: any, url: string) {
    for (const patch of patches) {
        if (url.includes(encodeURI(patch.search)) && patch.patch) {
            await patch.patch(json, url);
        }
    }
}

const patches: {
    search: string;
    replace?: (jsonText: string, url: string) => string;
    patch?: (json: any, url: string) => void | Promise<void>;
}[] = [{
    search: '魂器学院', // 魂器学院 Horcrux College

    replace(jsonText: string) {
        // add missing commas
        return jsonText.replace(/mtn"([^,])/gm, 'mtn",$1');
    },

    patch(json: Partial<Cubism2Spec.ModelJSON>) {
        // `textures` is an object with a single value which is the real textures array,
        // like { "textures": { '123': ["texture_00.png"] } }
        if (json.textures && !Array.isArray(json.textures)) {
            const realArray = Object.values(json.textures)[0] as string[];

            if (Array.isArray(realArray)) {
                json.textures = realArray
                    // some paths are missing the folder prefix
                    .map((tex: string) => tex.startsWith('textures/') ? tex : 'textures/' + tex);
            }
        }
    },
}, {
    search: '少女前线', // 少女前线 Girls Frontline

    async patch(json: Partial<Cubism2Spec.ModelJSON>, url: string) {
        // prefix paths of motion files
        if (json.motions?.idle?.length) {
            // only check and fix the first one
            const motion0 = json.motions.idle[0] as Partial<Cubism2Spec.Motion>;

            if (motion0.file?.startsWith('daiji')) {
                const fileExists = await ping(urlUtils.resolve(url, motion0.file));

                if (!fileExists) {
                    // misplaced motion file
                    motion0.file = 'motions/' + motion0.file;
                }
            }
        }

        extractCubism2IdleMotions(json, ['daiji']);
    },
}, {
    search: 'アンノウンブライド', // アンノウンブライド Unknown Bride

    async patch(json: Partial<CubismSpec.ModelJSON>, url: string) {
        // add missing textures
        if (json.FileReferences?.Textures?.length === 0) {
            const tex0Exists = await ping(urlUtils.resolve(url, 'textures/texture_00.png'));

            json.FileReferences.Textures.push(
                // two kinds of texture name
                tex0Exists ? 'textures/texture_00.png' : 'textures/texture_00 .png',
            );
        }

        // extract idle motions
        extractCubism4IdleMotions(json, ['home', 'gacha']);
    },
}, {
    search: '凍京', // 凍京Nerco TokyoNerco

    async patch(json: Partial<Cubism2Spec.ModelJSON | CubismSpec.ModelJSON>, url: string) {
        // some textures are misplaced
        const correctTexture = async (texture: string) => {
            if (!await ping(urlUtils.resolve(url, texture))) {
                return texture.replace('/texture', '/android/texture');
            }

            return texture;
        };

        if (Cubism2ModelSettings.isValidJSON(json)) {
            if (json.textures) {
                json.textures = await Promise.all(json.textures.map(correctTexture));
            }

            if (json.motions) {
                // rename `File` to `file` in each motion
                for (const motionGroup of Object.values(json.motions) as any[][]) {
                    if (motionGroup?.length) {
                        for (const motion of motionGroup) {
                            motion.file = motion.file ?? motion.File;

                            delete motion.File;
                        }
                    }
                }

                // some idle motions are misplaced in main group
                if (!json.motions.idle?.length && json.motions['']) {
                    json.motions.idle = json.motions[''].filter((motion: Cubism2Spec.Motion) => motion.file?.includes('loop'));
                }
            }
        } else if (Cubism4ModelSettings.isValidJSON(json)) {
            if (json.FileReferences?.Textures) {
                json.FileReferences.Textures = await Promise.all(json.FileReferences.Textures.map(correctTexture));
            }

            if (json.FileReferences?.Motions) {
                if (!json.FileReferences.Motions.Idle?.length && json.FileReferences.Motions['']) {
                    json.FileReferences.Motions.Idle = json.FileReferences.Motions['']
                        .filter((motion: CubismSpec.Motion) => motion.File?.includes('loop'));
                }
            }
        }
    },
}, {
    search: '天命之子', // 天命之子 Destiny Child

    patch(json: Partial<Cubism2Spec.ModelJSON>) {
        if (json.motions?.['']?.length && !json.motions?.idle?.length) {
            // deep clone all the motions as idle motion
            json.motions.idle = json.motions?.[''].map(motion => ({ ...motion }));
        }
    },
}, {
    search: '碧蓝航线', // 碧蓝航线 Azur Lane

    patch(json: Partial<CubismSpec.ModelJSON>) {
        extractCubism4IdleMotions(json, ['idle']);
    },
}, {
    search: '少女咖啡枪', // 少女咖啡枪 Girl Cafe Gun

    patch(json: Partial<CubismSpec.ModelJSON>) {
        extractCubism4IdleMotions(json, ['stand']);
    },
}, {
    search: 'princesses', // Sacred Sword Princesses

    patch(json: Partial<Cubism2Spec.ModelJSON>) {
        extractCubism2IdleMotions(json, ['default', 'loop']);
    },
}, {
    search: '崩坏', // 崩坏2 Honkai Impact 2

    patch(json: Partial<Cubism2Spec.ModelJSON>) {
        removeSoundDefs(json);
    },
}, {
    search: '战舰少女', // 战舰少女 Warship Girls

    patch(json: Partial<Cubism2Spec.ModelJSON>) {
        removeSoundDefs(json);
    },
}, {
    search: '机动战队', // 机动战队 Iron Saga

    patch(json: Partial<Cubism2Spec.ModelJSON>) {
        removeSoundDefs(json);
    },
}];

/**
 * Sets a motion as the idle motion if it's the only one in this model.
 */
function setSingleMotionAsIdle(json: Partial<CommonModelJSON>) {
    const motions = (json as CubismSpec.ModelJSON).FileReferences?.Motions;

    if (motions) {
        if (!motions.Idle?.[0] && motions['']?.length === 1) {
            // deep clone the array
            motions.Idle = motions[''].map(motion => ({ ...motion }));
        }
    }
}

/**
 * Extracts non-standard idle motions into the "idle" group.
 *
 * @param json
 * @param keywords Strings in lowercase.
 */
function extractCubism2IdleMotions(json: Partial<Cubism2Spec.ModelJSON>, keywords: string[]) {
    if (json.motions) {
        const idleMotions: Cubism2Spec.Motion[] = [];

        for (const [group, motions] of Object.entries(json.motions)) {
            if (group !== 'idle' && Array.isArray(motions)) {
                for (const motion of motions) {
                    for (const keyword of keywords) {
                        if (motion.file && motion.file.toLowerCase().includes(keyword)) {
                            idleMotions.push(motion);
                        }
                    }
                }
            }
        }

        if (idleMotions.length) {
            json.motions.idle = (json.motions.idle || []).concat(idleMotions);
        }
    }
}

/**
 * Extracts non-standard idle motions into the "Idle" group.
 *
 * @param json
 * @param keywords Strings in lowercase.
 */
function extractCubism4IdleMotions(json: Partial<CubismSpec.ModelJSON>, keywords: string[]) {
    if (json.FileReferences?.Motions) {
        const idleMotions: CubismSpec.Motion[] = [];

        for (const [group, motions] of Object.entries(json.FileReferences.Motions)) {
            if (group !== 'Idle' && Array.isArray(motions)) {
                for (const motion of motions) {
                    for (const keyword of keywords) {
                        if (motion.File && motion.File.toLowerCase().includes(keyword)) {
                            idleMotions.push(motion);
                        }
                    }
                }
            }
        }

        if (idleMotions.length) {
            json.FileReferences.Motions.Idle = (json.FileReferences.Motions.Idle || []).concat(idleMotions);
        }
    }
}

/**
 * Some models have sound definitions, but the sound files are not appearing in the repository,
 * so it's better to remove them to reduce the amount of errors in console.
 */
function removeSoundDefs(json: Partial<Cubism2Spec.ModelJSON>) {
    if (json.motions) {
        for (const motionGroup of Object.values(json.motions as Record<string, Cubism2Spec.Motion[]>)) {
            if (motionGroup?.length) {
                for (const motion of motionGroup) {
                    motion.sound = undefined;
                }
            }
        }
    }
}
