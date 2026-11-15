// One platform grouping for the funnel, daily chart and source table.
export const sourceGroups=[['facebook','Facebook',['facebook_ads','facebook']],['instagram','Instagram',['instagram_ads','instagram']],['other','Others',['meta','direct','unknown','organic']]];
export const sourceGroup=source=>sourceGroups.find(([, ,members])=>members.includes(source))?.[0]||'other';
