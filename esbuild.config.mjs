import * as esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['src/discord/index.js'],
    bundle: true,
    outfile: 'dist/discord/index.js',
    format: 'esm',
    platform: 'neutral',
    target: 'es2024',
    define: {
        'import.meta.NODE_ENV': '"production"'
    },
    external: ['@discordjs/rest', 'discord-api-types'],
    banner: {
        js: '// @ts-nocheck\n'
    }
});