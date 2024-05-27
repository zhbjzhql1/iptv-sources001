import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataFilePath = `${__dirname}/iptv/`;

const allowedGenreNames = {
    '央视频道': '央视',
    '卫视频道': '卫视',
    '上海频道': '上海',
};
const genreSeparator = '\n\n';
const genreNameSeparator = ',#';

const main = async () => {
    const url = 'https://m3u.ibert.me/txt/fmml_ipv6.txt';
    const genres = fetchIptv(url);
    const filteredGenres = [];
    for (const genre of genres.split(genreSeparator)) {
        const genreName = genre.split(genreNameSeparator)[0];
        if (allowedGenreNames[genreName]) {
            filteredGenres.push([allowedGenreNames[genreName], genre.split(genreNameSeparator)[1]].join(genreNameSeparator));
        }
    }

    const newGenres = filteredGenres.join(genreSeparator);

    fs.writeFileSync(`${dataFilePath}/fmml_ipv6_sh.txt`, newGenres);
};

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
