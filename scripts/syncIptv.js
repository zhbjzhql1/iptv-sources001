import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataFilePath = `${__dirname}/../iptv/`;

const GENRE_SEPARATOR = '\n\n';
const GENRE_NAME_SEPARATOR = ',#';
const GENRE_NAME_REGEX = /group-title="([^"]*)"/;

const SOURCES = [
    {
        id: 'fmml_ipv6_sh',
        alias: 'fmml',
        type: 'diyp',
        url: 'https://m3u.ibert.me/txt/fmml_ipv6.txt',
        genres: {
            '央视频道': '央视',
            '卫视频道': '卫视',
            '上海频道': '上海',
        }
    },
    {
        id: 'aptv',
        type: 'm3u',
        url: 'https://raw.githubusercontent.com/Kimentanm/aptv/master/m3u/iptv.m3u'
    }
];

const main = async () => {
    for (const source of SOURCES) {
        const origin = await fetchSource(source.url);
        const genres = source.type === 'm3u' ? m3uToDiyp(origin) : origin;
        const filteredGenres = await filterGenre(genres, source.genres);
        fs.writeFileSync(`${dataFilePath}${source.id}.txt`, filteredGenres);
        // filter function doesn't support m3u
        source.type === 'm3u' && fs.writeFileSync(`${dataFilePath}${source.id}.m3u`, origin);
        if (source.alias) {
            fs.writeFileSync(`${dataFilePath}${source.alias}.txt`, filteredGenres);
            source.type === 'm3u' && fs.writeFileSync(`${dataFilePath}${source.id}.m3u`, origin);
        }
    }
};

const filterGenre = async (genres, allowedGenres) => {
    if (allowedGenres) {
        const filteredGenres = [];
        for (const genre of genres.split(GENRE_SEPARATOR)) {
            const genreName = getGenreName(genre);
            if (genreName && genreName in allowedGenres) {
                const genreAlias = allowedGenres[genreName];
                if (genreAlias) {
                    filteredGenres.push([allowedGenres[genreName], genre.split(GENRE_NAME_SEPARATOR)[1]].join(GENRE_NAME_SEPARATOR));
                } else {
                    filteredGenres.push(genre);
                }
            }
        }

        return filteredGenres.join(GENRE_SEPARATOR);
    }

    return genres;
}

/**
 * 2 Different types of genre name:
 *   央视频道,#genre#
 *   #EXTINF:-1 tvg-id="CHC家庭影院" tvg-name="CHC家庭影院" tvg-logo="https://live.fanmingming.com/tv/CHC家庭影院.png" group-title="央视IPV4",CHC家庭影院
 * @param genre
 * @returns {*}
 */
const getGenreName = (genre) => {
    const result = genre.match(GENRE_NAME_REGEX);
    if (result) return result[1];

    return genre.split(GENRE_NAME_SEPARATOR)[0];
}

const m3uToDiyp = (m3uContent, genreFlag = "#genre#") => {
    const lines = m3uContent.split('\n');
    let diypLines = [];
    let genreName = '';
    let lastGenreName = '';
    let channelName = '';

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            const result = line.match(GENRE_NAME_REGEX);
            if (result) {
                genreName = result[1];
            }
            // 提取频道名称
            const nameStartIndex = line.indexOf(',') + 1;
            channelName = line.substring(nameStartIndex).trim();
        } else if (line.startsWith('http://') || line.startsWith('https://')) {
            // 获取频道的 URL 并生成 DIYP 行
            const channelUrl = line.trim();
            const diypLine = `${channelName},${channelUrl}`;
            diypLines.push(diypLine);
        }
        if (genreName !== lastGenreName) {
            diypLines.push('');
            diypLines.push(`${genreName},${genreFlag}`);
            lastGenreName = genreName;
        }
    });

    return diypLines.join('\n').trim();
}

const fetchSource = async (url) => {
    const options = {
        method: 'GET',
    };
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    try {
        return await response.text();
    } catch (error) {
        console.error('There was a problem with your fetch operation:', error);
    }
};

main();
