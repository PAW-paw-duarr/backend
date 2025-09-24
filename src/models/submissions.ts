import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
  type ReturnModelType,
} from "@typegoose/typegoose";
import mongoose from "mongoose";
import { TeamsClass } from "./teams.js";

@modelOptions({ schemaOptions: { collection: "submissions" } })
export class SubmissionsClass {
  public id!: string;

  @prop({ required: true, ref: () => TeamsClass })
  public team!: Ref<TeamsClass>;

  @prop({ required: true, ref: () => TeamsClass })
  public team_target!: Ref<TeamsClass>;

  @prop({ required: true, type: String })
  public grand_design_url!: string;

  @prop({ type: Boolean })
  public accepted?: boolean;

  /**
   * Find a submission by ID if the current team is either the submitter or the target.
   * @param {ReturnModelType<typeof SubmissionsClass>} this SubmissionClass model.
   * @param {string} id The searched submission ID.
   * @param {string} currentTeamId Current team ID.
   * @returns
   */
  public static async findByIdLimited(
    this: ReturnModelType<typeof SubmissionsClass>,
    id: string,
    currentTeamId: string,
  ) {
    return this.findOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        $or: [{ team: currentTeamId }, { team_target: currentTeamId }],
      },
      { id: 1, team: 1, team_target: 1, grand_design_url: 1, accepted: 1 },
    );
  }

  /**
   * Get all submissions if the current team is either the submitter or the target.
   * @param {ReturnModelType<typeof SubmissionsClass>} this SubmissionClass model.
   * @param {string} currentTeamId Current team ID.
   * @returns
   */
  public static async getAllDataLimited(
    this: ReturnModelType<typeof SubmissionsClass>,
    currentTeamId: string,
  ) {
    return this.find(
      { $or: [{ team_target: currentTeamId }, { team: currentTeamId }] },
      { id: 1, team: 1, team_target: 1 },
    );
  }

  /**
   * Update `accepted` field of a submission where the responder is the target team.
   * @param {ReturnModelType<typeof SubmissionsClass>} this SubmissionsClass model.
   * @param {string} id The searched submission ID to be updated.
   * @param {string} currentTeamId Current team ID.
   * @param {boolean} accept Accept/decline the submission.
   * @returns
   */
  public static async updateAcceptedLimited(
    this: ReturnModelType<typeof SubmissionsClass>,
    id: string,
    currentTeamId: string,
    accept: boolean,
  ) {
    return this.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), team_target: currentTeamId },
      { accepted: accept },
      { new: true },
    );
  }

  /**
   * Create a new submission record.
   * @param {ReturnModelType<typeof SubmissionsClass>} this SubmissionsClass model.
   * @param {string} teamId Submitter team ID.
   * @param {string} teamTargetId Target team ID.
   * @param {string} grandDesignUrl Grand design URL.
   * @returns
   */
  public static async createNewSubmission(
    this: ReturnModelType<typeof SubmissionsClass>,
    teamId: string,
    teamTargetId: string,
    grandDesignUrl: string,
  ) {
    return this.create({
      team: teamId,
      team_target: teamTargetId,
      grand_design_url: grandDesignUrl,
    });
  }

  // ===== ADMIN FUNCTIONS =====

  /**
   * Get all submissions from the database — **ADMIN ONLY**.
   * @param {ReturnModelType<typeof SubmissionsClass>} this SubmissionsClass model.
   * @returns
   */
  public static async getAllData(this: ReturnModelType<typeof SubmissionsClass>) {
    return this.find({}, { id: 1, team: 1, team_target: 1 });
  }

  /**
   * Get a submission by ID — **ADMIN ONLY**.
   * @param {ReturnModelType<typeof SubmissionsClass>} this SubmissionsClass model.
   * @param {string} id The searched submission ID.
   * @returns
   */
  public static async findById(this: ReturnModelType<typeof SubmissionsClass>, id: string) {
    return this.findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { id: 1, team: 1, team_target: 1, grand_design_url: 1, accepted: 1 },
    );
  }

  /**
   * Delete a submission by ID without constraints — **ADMIN ONLY**.
   * @param {ReturnModelType<typeof SubmissionsClass>} this SubmissionsClass model.
   * @param {string} id The submission ID to be deleted.
   * @returns
   */
  public static async deleteById(this: ReturnModelType<typeof SubmissionsClass>, id: string) {
    return this.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id) }, { id: 1 });
  }
}

export const SubmissionModel = getModelForClass(SubmissionsClass);
