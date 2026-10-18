import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const topologyTemplates=sqliteTable('topology_templates',{
  id:text('id').primaryKey(),
  name:text('name').notNull(),
  metadataJson:text('metadata_json').notNull().default('{}'),
  revision:integer('revision').notNull().default(1),
  projectJson:text('project_json').notNull(),
  deviceCount:integer('device_count').notNull(),
  linkCount:integer('link_count').notNull(),
  createdAt:text('created_at').notNull(),
},table=>[index('idx_topology_templates_created').on(table.createdAt)]);
export const designReviews=sqliteTable('design_reviews',{
 id:text('id').primaryKey(),name:text('name').notNull(),projectJson:text('project_json').notNull(),createdAt:text('created_at').notNull()
});
export const reviewComments=sqliteTable('review_comments',{
 id:text('id').primaryKey(),reviewId:text('review_id').notNull().references(()=>designReviews.id,{onDelete:'cascade'}),target:text('target').notNull(),author:text('author').notNull(),text:text('text').notNull(),status:text('status').notNull(),createdAt:text('created_at').notNull()
},t=>[index('idx_review_comments_review').on(t.reviewId)]);
