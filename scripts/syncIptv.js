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
        url: 'https://m3u.ibert.me/txt/fmml_ipv6.txt',
        genres: {
            '央视频道': '央视',
            '卫视频道': '卫视',
            '上海频道': '上海',
        }
    },
    {
        id: 'aptv',
        url: 'https://raw.githubusercontent.com/Kimentanm/aptv/master/m3u/iptv.m3u'
    }
];

const main = async () => {
    for (const source of SOURCES) {
        const filteredSource = await filterGenre(source.url, source.genres);
        fs.writeFileSync(`${dataFilePath}${source.id}.txt`, filteredSource);
        fs.writeFileSync(`${dataFilePath}${source.id}.m3u`, filteredSource);
        if (source.alias) {
            fs.writeFileSync(`${dataFilePath}${source.alias}.txt`, filteredSource);
            fs.writeFileSync(`${dataFilePath}${source.alias}.m3u`, filteredSource);
        }
    }
};

const filterGenre = async (sourceUrl, allowedGenres) => {
    const source = await fetchIptv(sourceUrl);
    if (allowedGenres) {
        const filteredGenres = [];
        for (const genre of source.split(GENRE_SEPARATOR)) {
            const genreName = getGenreName(genre);
            if (genreName && genreName in allowedGenres) {
                const genreAlias = allowedGenres[genreName];
                if (genreAlias) {
                    // FIXME: Doesn't support type 2
                    filteredGenres.push([allowedGenres[genreName], genre.split(GENRE_NAME_SEPARATOR)[1]].join(GENRE_NAME_SEPARATOR));
                } else {
                    filteredGenres.push(genre);
                }
            }
        }

        return filteredGenres.join(GENRE_SEPARATOR);
    }

    return source;
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

const fetchIptv = async (url) => {
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
