import { Octokit } from "@octokit/rest";

export const DataRepository = ({gist_id, github_token, file_name}) => {
  const octokit = new Octokit({
    auth: `token ${github_token}`
  });
  const getGist = async () =>  {
    try {
      return await octokit.gists.get({ gist_id });
    } catch (error) {
      console.error(`Unable to get gist\n${error}`);
    }
  }
  const parseContent = (content) => {
    return JSON.stringify(content)
  }
  const updateFiles = async ({description, files}) => {
    try {
      await octokit.gists.update({
        gist_id,
        description,
        files
      });
    } catch (error) {
      console.error(`Unable to update gist\n${error}`);
    }
  }
  return {
    async get() {
      const gist = await getGist();
      return JSON.parse(gist.data.files[file_name].content);
    },
    async set(content) {
      await updateFiles({
        files: {
          [file_name]: {
            content: parseContent(content)
          },
        }
      })
    }
  }
}